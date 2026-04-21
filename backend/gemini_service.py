import google.generativeai as genai
from proxy_provider import get_gemini_key

def call_gemini_agent(prompt: str):
    """
    Calls Gemini API with automatic key rotation and basic 429 retry.
    """
    current_key = get_gemini_key()
    genai.configure(api_key=current_key)
    
    # We use gemini-1.5-flash for speed or gemini-1.5-pro for quality
    model = genai.GenerativeModel('gemini-1.5-flash') 
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:  # Resource Exhausted / Quota hit
            print(f"Key rotation triggered. Current key quota exhausted. trying next...")
            new_key = get_gemini_key()
            genai.configure(api_key=new_key)
            # Re-initialize model with new config if needed, though genai.configure is global
            return model.generate_content(prompt).text
        
        print(f"Gemini API Error: {error_msg}")
        raise e
