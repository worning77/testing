from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import SemanticSimilarityExampleSelector
from langchain.vectorstores import Chroma
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import PromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)
from flask import Flask, request, jsonify
import json
import dotenv
from flask_cors import CORS

dotenv.load_dotenv()

follow_up_enabled = False

def parse_JSON(jsonString):
    res = {}

    # Check for empty or None input
    if not jsonString:
        return res

    # Remove '{' and '}'
    cleaned_string = jsonString[jsonString.find("{")+1:jsonString.rfind("}")].strip()

    # Extracting type
    if '"type":' in cleaned_string:
        start_type = cleaned_string.index('"type": ') + len('"type": ')
        end_type = cleaned_string.index(',', start_type)
        type_value = cleaned_string[start_type:end_type].strip('"').strip()
        res['type'] = type_value


    if '"message":' in cleaned_string:
        start_type = cleaned_string.index('"message": ') + len('"message": ')
        end_type = cleaned_string.index(',', start_type)
        messagevalue = cleaned_string[start_type:end_type].strip('"').strip()
        res['message'] = messagevalue


    # Extracting content
    if '"content":' in cleaned_string:
        start_content = cleaned_string.index('"content":') + len('"content":')
        content_value = cleaned_string[start_content:].strip().lstrip('"""').rstrip('"""')
        content_value = content_value.replace("\\" , "")
        res['content'] = content_value


    return res


# Initialize Flask
app = Flask(__name__)
CORS(app)

@app.route('/API-key', methods=['POST'])
def test():
    return "ho"


@app.route('/toggle_follow_up', methods=['POST'])
def toggle_follow_up():
    global follow_up_enabled
    data = request.json
    follow_up_enabled = data.get("followUpEnabled", False)
    return jsonify({"message": "Follow-up state updated", "state": follow_up_enabled})


# Route to handle POST requests
@app.route('/generate_script', methods=['POST'])
def generate_script():
    global follow_up_enabled
    data = request.json
    user_input = data.get("input")
    print(user_input)

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    # Invoke your existing logic
    # Check if follow-ups are enabled
    if follow_up_enabled:
        # Logic for follow-up (bypass retrieval)
        output = chain_noRAG.invoke({"input": user_input, "chat_history": chat_history})
    else:
        # Existing logic with retrieval
        output = chain.invoke({"input": user_input, "chat_history": chat_history})
    res = parse_JSON(output.content)

    # Update chat history
    chat_history.append({"input": user_input, "output": res})
    print(res)
    # Respond with the generated script
    return jsonify(res)

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)



