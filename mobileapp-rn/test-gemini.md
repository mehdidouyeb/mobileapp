# Gemini API Testing Guide

## Fixed Issues

1. **Model Names**: Changed from non-existent `gemini-2.5-flash` to valid `gemini-1.5-flash`
2. **API Endpoints**: Standardized to use `v1` API for all models
3. **Error Handling**: Simplified and removed duplicate network checks
4. **Configuration**: Verified API key loading from multiple sources

## Testing Steps

### 1. Set up your API key

Create a `.env` file in the `mobileapp-rn` directory:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Or add it to your `app.config.ts` extra section.

### 2. Test the connection

Use the TestGeminiConnection component or run the app and try sending a message.

### 3. Expected behavior

- App should auto-connect to Gemini when you send your first message
- You should see "✅ Gemini connected successfully" in logs
- Messages should be sent to `gemini-1.5-flash` model
- Responses should come back in the target language

## Common Issues & Solutions

### API Key Issues
- Make sure your Gemini API key is valid and has sufficient quota
- Check that the environment variable is loaded correctly
- Verify the key is saved to SecureStore

### Network Issues
- Ensure you have internet connection
- Check if any firewall is blocking the API calls
- Verify the API endpoint is reachable

### Model Issues
- `gemini-1.5-flash` is the recommended model for this app
- If you experience issues, the hook will automatically try fallback models

## Debug Logs

The hook provides extensive logging. Look for these key messages:

- `🔑 Using API key from [source]`
- `✅ Gemini connected successfully`
- `🎯 Trying models in order: [...]`
- `✅ Successfully got response from [model]`

## Next Steps

1. Add your Gemini API key to the environment
2. Test sending a message in the app
3. Check the logs for successful connection and response
4. Verify voice chat functionality works end-to-end
