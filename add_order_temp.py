import pymongo

client = pymongo.MongoClient()
collection = client['twitch_comments']['annotation']

query = {"sample": 0.0}

sort = [(u"_id", 1)]

cursor = collection.find(query, sort=sort)
try:
    i = 1
    for doc in cursor:
        doc['order'] = i
        collection.update_one({"_id": doc['_id']}, {'$set': doc}, upsert=False)
        i += 1
finally:
    client.close()
