from flask import Flask, render_template, request, jsonify
import pickle
import requests
import json
import os
from dotenv import load_dotenv
from os import environ

app = Flask(__name__)
load_dotenv()

with open("logistic_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

with open("count_vectorizer.pkl", "rb") as vectorizer_file:
    vectorizer = pickle.load(vectorizer_file)

ans_map = {
    0: ' Appreciative.',
    1: ' Appreciative',
    2: ' Cautionary',
    3: ' Diplomatic',
    4: ' Direct',
    5: ' Informative',
    6: ' Inspirational',
    7: ' Thoughtful',
    8: ' Witty',
    9: ' Absurd',
    10: ' Accusatory',
    11: ' Acerbic',
    12: ' Admiring',
    13: ' Aggressive',
    14: ' Aggrieved',
    15: ' Altruistic',
    16: ' Ambivalent',
    17: ' Amused',
    18: ' Angry',
    19: ' Animated',
    20: ' Apathetic',
    21: ' Apologetic',
    22: ' Ardent',
    23: ' Arrogant',
    24: ' Assertive',
    25: ' Belligerent',
    26: ' Benevolent',
    27: ' Bitter',
    28: ' Callous',
    29: ' Candid',
    30: ' Caustic'
}

def get_tone(text):
    text = [text]
    text_vectorized = vectorizer.transform(text)
    prediction = model.predict(text_vectorized)
    return ans_map[prediction[0]]

def get_content(text):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + os.getenv("GEMINI_API_KEY")

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": text}
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        response.raise_for_status()  # Raises exception for 4XX/5XX responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request error: {str(e)}")
        return {"error": str(e)}
    
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process-speech', methods=['POST'])
def process_speech():
    data = request.get_json()
    user_text = data.get('text', '')
    
    if not user_text:
        return jsonify({
            'response': "I didn't catch that. Could you please repeat?",
            'tone': "Informative"
        })
    
    # Get the tone of the input text
    tone = get_tone(user_text)
    
    # Generate response with the detected tone
    prompt = f"Respond to the following question naturally and conversationally in a {tone} tone: {user_text}"
    response_data = get_content(prompt)
    
    # Check for API errors
    if "error" in response_data:
        return jsonify({
            'response': f"Sorry, I encountered an error: {response_data['error']}",
            'tone': tone
        })
        
    try:
        bot_response = response_data["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({
            'response': bot_response,
            'tone': tone
        })
    except (KeyError, IndexError, TypeError) as e:
        print(f"Error parsing response: {str(e)}")
        print(f"Response data: {response_data}")
        return jsonify({
            'response': "Sorry, I couldn't process that request properly.",
            'tone': tone
        })

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(environ.get("PORT", 5000)))
