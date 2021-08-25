import json
import math
from datetime import datetime

import pymongo
from bson import ObjectId
from flask import Flask, request, make_response, jsonify, render_template
from sshtunnel import SSHTunnelForwarder
from waitress import serve

app = Flask(__name__)
app.config.from_pyfile("conf/app.conf")


# @app.route("/")
# def init():
#     prefix = ''
#     if env == 'production':
#         prefix = "/annotation"
#     return render_template('index.html', prefix=prefix, is_sample=0)


@app.route("/samples", methods=["GET", "POST"])
def get_samples():
    is_sample = int(request.args.get('is_sample'))
    total = int(request.args.get('total'))
    number = int(request.args.get('number'))
    find_query = {}
    all_samples = []
    if total is not None and number is not None and total >= number:
        results = None
        find_query['sample'] = 0
        count = collection.count_documents(find_query)
        if total > 0 and number > 0:
            single_size = math.ceil(count / total)
            skip = single_size * (number - 1)
            results = collection.find(find_query, {"_id": 0}, sort=[('order', 1)]).limit(single_size).skip(skip)
        elif total == 0 and number == 0:
            results = collection.find(find_query, {"_id": 0}, sort=[('order', 1)])
        if results:
            for doc in results:
                doc['ori_id'] = str(doc['ori_id'])
                all_samples.append(doc)
    if is_sample is not None and is_sample > 0:
        find_query['sample'] = int(is_sample)
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
    return render_template('index.html', prefix=prefix, is_sample=1, total=-1, number=-1)


@app.route("/<total>/<number>", methods=["GET"])
def split_data(total, number):
    prefix = ''
    if env == 'production':
        prefix = "/annotation"
    return render_template('index.html', prefix=prefix, is_sample=0, total=total, number=number)


@app.route("/0", methods=['GET'])
def total_data():
    prefix = ''
    if env == 'production':
        prefix = "/annotation"
    return render_template('index.html', prefix=prefix, is_sample=0, total=0, number=0)


# connect to remote mongodb on Kogecha
def get_mongodb_client():
    global client, server
    mongo_host = app.config['MONGO_SERVER']
    mongo_user = app.config['MONGO_USER']
    mongo_pass = app.config['MONGO_PASS']
    if not mongo_user or not mongo_pass:
        raise Exception("MongoDB username or password should not be null. Please check app.conf file.")
    server = SSHTunnelForwarder(
        mongo_host,
        ssh_username=mongo_user,
        ssh_password=mongo_pass,
        remote_bind_address=('127.0.0.1', 27017)
    )
    server.start()
    client = pymongo.MongoClient("127.0.0.1", server.local_bind_port)
    return client, server


# If you want to use the remote database, please fill in the username & pwd in conf/app.conf for **logging into Kegecha**
# !!!Never use the "annotation" collection from the "twitch_comments" database!!!
if __name__ == "__main__":
    server, client = None, None
    env = app.config['ENV']
    db = app.config['DATABASE']
    coll = app.config['COLLECTION']
    port = int(app.config['PORT'])
    try:
        if env == 'development':
            client = pymongo.MongoClient()
            collection = client[db][coll]
            app.run(port=port)
        elif env == 'production':
            client, server = get_mongodb_client()
            collection = client[db][coll]
            serve(app, port=port)
    finally:
        if client:
            client.close()
        if server:
            server.close()
