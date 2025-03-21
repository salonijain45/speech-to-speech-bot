# speech-to-speech-bot
# Speech to Speech Bot

A responsive web application that allows real-time speech-to-speech conversations with AI, using tone detection to create context-aware responses.

## Features

- **Voice Recognition**: Captures user speech using browser's Speech Recognition API
- **Tone Detection**: Analyzes the emotional tone of user input
- **AI-Powered Responses**: Generates contextually appropriate responses using Google's Gemini API
- **Speech Synthesis**: Converts text responses to natural-sounding speech
- **Real-time Visual Feedback**: Shows listening/speaking status with animated indicators

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **APIs**: Web Speech API, Google Gemini API
- **Machine Learning**: Scikit-learn for tone detection

## Installation

1. Clone this repository
2. Create a virtual environment: `python -m venv env`
3. Activate the virtual environment:
    - Windows: `env\Scripts\activate`
    - macOS/Linux: `source env/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set up environment variables in `.env`:
    ```
    GEMINI_API_KEY=your_api_key_here
    FLASK_DEBUG=True
    ```

## Usage

1. Run the application: `python app.py`
2. Open your browser and navigate to `http://127.0.0.1:5000/`
3. Click "Start Speaking" and begin talking
4. The bot will listen, analyze your tone, and respond both visually and audibly

## Requirements

- Python 3.6+
- Modern web browser with Speech Recognition support (Chrome recommended)
- Internet connection# speech-to-speech-bot
