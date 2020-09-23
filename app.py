import json

import pymongo
from flask import Flask, request, make_response, jsonify, render_template
from datetime import datetime
from bson import ObjectId
from sshtunnel import SSHTunnelForwarder


app = Flask(__name__)
app.config.from_pyfile("conf/app.conf")


@app.route("/")
def init():
    prefix = ''
    if env == 'production':
        prefix = "/annotation"
    return render_template('index.html', prefix=prefix, is_sample=0)


@app.route("/samples", methods=["GET", "POST"])
def get_samples():
    query_params = request.args.get('is_sample')
    find_query = {}
    if query_params:
        find_query['sample'] = int(query_params)
    all_samples = []
    for doc in collection.find(find_query, {"_id": 0}):
        doc['ori_id'] = str(doc['ori_id'])
        all_samples.append(doc)
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


@app.route("/notes", methods=["POST"])
def update_notes():
    data = json.loads(str(request.get_data(), "utf-8"))
    try:
        result = collection.update_one({'ori_id': ObjectId(data['ori_id'])}, {'$set': {'notes': data['notes']}})
        return make_response({'result': 'success'})
    except Exception as e:
        return make_response({'result': 'fail', 'error': str(e)})


@app.route("/sample", methods=["GET"])
def sample_page():
    prefix = ''
    if env == 'production':
        prefix = "/annotation"
    return render_template('index.html', prefix=prefix, is_sample=1)


def get_mongodb_client():
    global client, server
    mongo_host = app.config['MONGO_SERVER']
    mongo_user = app.config['MONGO_USER']
    mongo_pass = app.config['MONGO_PASS']
    server = SSHTunnelForwarder(
        mongo_host,
        ssh_username=mongo_user,
        ssh_password=mongo_pass,
        remote_bind_address=('127.0.0.1', 27017)
    )
    server.start()
    client = pymongo.MongoClient("127.0.0.1", server.local_bind_port)
    return client, server


if __name__ == "__main__":
    server = None
    client = None
    env = app.config['ENV']
    if env == 'development':
        client = pymongo.MongoClient()
    elif env == 'production':
        client, server = get_mongodb_client()
    try:
        collection = client['twitch_comments']['annotation']
        app.run(port=8092)
    finally:
        if client:
            client.close()
        if server:
            server.close()
