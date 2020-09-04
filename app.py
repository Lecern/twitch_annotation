import json

import pymongo
from flask import Flask, request, make_response, jsonify, render_template
from datetime import datetime
from bson import ObjectId


app = Flask(__name__)


@app.route("/")
def init():
    return render_template('index.html')


@app.route("/samples", methods=["GET"])
def get_samples():
    all_samples = []
    for doc in collection.find({}, {"_id": 0}):
        doc['ori_id'] = str(doc['ori_id'])
        all_samples.append(doc)
    # all_samples = [doc for doc in )]
    return make_response(jsonify(all_samples))


@app.route("/update", methods=["POST"])
def update_labels():
    json_request = str(request.get_data(), "utf-8")
    data = json.loads(json_request)
    status = 0
    if 'offensive' in data and data['offensive'] == 'Unreadable' and 'target' not in data and 'type' not in data:
        status = -1
    elif 'offensive' in data and data['offensive'] == 'OFF' and 'target' in data and 'type' in data:
        status = 1
    elif 'offensive' in data and data['offensive'] == 'NOT' and 'target' not in data and 'type' not in data:
        status = 1
    elif 'offensive' in data and data['offensive'] == 'OFF' and (
            ('target' in data and 'type' not in data) or ('target' not in data and 'type' in data) or (
            'target' not in data and 'type' not in data)):
        status = 0
    data['status'] = status
    data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    data['ori_id'] = ObjectId(data['ori_id'])
    unset = {}
    if 'target' not in data:
        unset["target"] = ""
    if 'type' not in data:
        unset["type"] = ""
    update = {'$set': data}
    if unset:
        update['$unset'] = unset
    try:
        collection.update_one({'ori_id': data['ori_id']}, update)
        return make_response({'result': 'success', 'ori_id': str(data['ori_id']), 'status': data['status']})
    except Exception as e:
        return make_response({'result': 'fail', 'error': str(e)})


if __name__ == "__main__":
    client = pymongo.MongoClient()
    try:
        collection = client['twitch_comments']['annotation']
        app.run(port=8092, debug=True)
    finally:
        client.close()
