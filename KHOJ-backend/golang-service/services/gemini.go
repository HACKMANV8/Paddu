package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"bytes"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Resolve API key from common headers; if absent, fall back to env vars
func ResolveGeminiAPIKeyFromRequest(c *gin.Context) string {
	// Header-first resolution
	headers := []string{"X-Gemini-Api-Key", "X-Google-Api-Key", "X-Api-Key"}
	for _, h := range headers {
		if v := strings.TrimSpace(c.GetHeader(h)); v != "" {
			return v
		}
	}
	// Env fallback
	return ResolveGeminiAPIKeyFromEnv()
}

// ResolveGeminiAPIKeyFromEnv checks common env variable names
func ResolveGeminiAPIKeyFromEnv() string {
	candidates := []string{"GEMINI_API_KEY", "GOOGLE_API_KEY", "GENAI_API_KEY", "API_KEY"}
	for _, name := range candidates {
		if v := strings.TrimSpace(os.Getenv(name)); v != "" {
			return v
		}
	}
	return ""
}

// GenerateGeminiReply calls Google Gemini with a topic-aware prompt
func GenerateGeminiReply(ctx context.Context, apiKey string, preferredModel string, topic string, input string) (string, error) {
	if strings.TrimSpace(apiKey) == "" {
		return "", fmt.Errorf("GEMINI_API_KEY not set")
	}

    // First, try REST (more tolerant across environments)
    {
    // candidate models to try via REST first (prioritize those your key lists)
        modelCandidates := []string{}
        if m := strings.TrimSpace(preferredModel); m != "" { modelCandidates = append(modelCandidates, m) }
        modelCandidates = append(modelCandidates,
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-001",
            "gemini-2.0-flash-lite-001",
            "gemini-2.0-flash-lite",
        )
        prompt := fmt.Sprintf("You are a helpful tutor. The chat topic is '%s'. Answer ONLY within this topic. User: %s", topic, input)
        if out, err := httpFallbackGenerate(prompt, apiKey, modelCandidates); err == nil && strings.TrimSpace(out) != "" {
            return out, nil
        }
    }

    client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("gemini client init failed: %w", err)
	}
	defer client.Close()

	// Try a set of commonly available models for v1beta
    modelCandidates := []string{}
	if m := strings.TrimSpace(preferredModel); m != "" {
		modelCandidates = append(modelCandidates, m)
	}
    modelCandidates = append(modelCandidates,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-lite-001",
        "gemini-2.0-flash-lite",
    )

	prompt := fmt.Sprintf(
		"You are a helpful tutor. The chat topic is '%s'. Answer ONLY within this topic. User: %s",
		topic, input,
	)

	var lastErr error
	for _, modelName := range modelCandidates {
		model := client.GenerativeModel(modelName)
		resp, err := model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			// If a model is not found/unsupported, try the next
			e := strings.ToLower(err.Error())
			if strings.Contains(e, "not found") || strings.Contains(e, "unsupported") || strings.Contains(e, "404") {
				lastErr = fmt.Errorf("model %s: %w", modelName, err)
				continue
			}
			return "", fmt.Errorf("gemini request failed: %w", err)
		}

		for _, cand := range resp.Candidates {
			for _, part := range cand.Content.Parts {
				if t, ok := part.(genai.Text); ok {
					return string(t), nil
				}
			}
		}
		lastErr = fmt.Errorf("model %s returned no text", modelName)
	}

	// If SDK attempts failed, try raw HTTP REST (v1 then v1beta)
	if lastErr != nil {
		if out, err := httpFallbackGenerate(prompt, apiKey, modelCandidates); err == nil && strings.TrimSpace(out) != "" {
			return out, nil
		}
		return "", lastErr
	}
	return "", fmt.Errorf("gemini returned no text")
}

// httpFallbackGenerate calls the REST API directly, trying v1 then v1beta
func httpFallbackGenerate(prompt string, apiKey string, modelCandidates []string) (string, error) {
	versions := []string{"v1", "v1beta"}
	bodyObj := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{map[string]interface{}{"text": prompt}},
			},
		},
	}

	for _, ver := range versions {
		for _, model := range modelCandidates {
			url := fmt.Sprintf("https://generativelanguage.googleapis.com/%s/models/%s:generateContent?key=%s", ver, model, apiKey)
			b, _ := json.Marshal(bodyObj)
			req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: 30 * 1e9}
			resp, err := client.Do(req)
			if err != nil {
				continue
			}
			defer resp.Body.Close()
			if resp.StatusCode < 200 || resp.StatusCode >= 300 {
				// try next model/version
				io.Copy(io.Discard, resp.Body)
				continue
			}
			var parsed struct {
				Candidates []struct {
					Content struct {
						Parts []struct{
							Text string `json:"text"`
						} `json:"parts"`
					} `json:"content"`
				} `json:"candidates"`
			}
			dec := json.NewDecoder(resp.Body)
			if err := dec.Decode(&parsed); err != nil {
				continue
			}
			for _, c := range parsed.Candidates {
				for _, p := range c.Content.Parts {
					if strings.TrimSpace(p.Text) != "" {
						return p.Text, nil
					}
				}
			}
		}
	}
	return "", fmt.Errorf("no supported model found via REST v1/v1beta")
}


