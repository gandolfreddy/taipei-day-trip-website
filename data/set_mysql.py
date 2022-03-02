'''
    +--------------+------------+
    |       Data fields         |
    +--------------+------------+
    |    MYSQL     |    json    |
    +--------------+------------+
 PK |  id          |  _id       |
    |  name        |  stitle    |
    |  category    |  CAT2      |
    |  description |  xbody     |
    |  address     |  address   |
    |  transport   |  info      |
    |  mrt         |  MRT       |
    |  latitude    |  latitude  |
    |  longitude   |  longitude |
    |  images      |  file      |
    +--------------+------------+
'''


from decouple import config
import mysql.connector
import json


CONFIG = {
    "user": config("USER"),
    "password": config("PASSWORD"),
    "host": config("HOST"),
    "database": config("DATABASE")
}

cnx = mysql.connector.connect(**CONFIG)
cursor = cnx.cursor()

create_table_cmd = '''
    create table taipei_attractions (
        id bigint not null,
        name text not null, 
        category text not null, 
        description text not null, 
        address text not null, 
        transport text not null, 
        mrt text not null, 
        latitude float(10, 7) not null, 
        longitude float(10, 7) not null, 
        images text not null, 
        primary key (id)
    );
'''

cursor.execute(create_table_cmd)

with open("./taipei-attractions.json", 'r', encoding="UTF-8") as fin:
    results = json.loads(fin.readline())["result"]["results"]

for i, result in enumerate(results):
    insert_cmd = '''
        insert into taipei_attractions 
                    (id, name, category, 
                    description, address, transport, 
                    mrt, latitude, longitude, images)
                    values 
                    (%(id)s, %(name)s, %(category)s, 
                    %(description)s, %(address)s, %(transport)s, 
                    %(mrt)s, %(latitude)s, %(longitude)s, %(images)s);
    '''
    insert_content = {
        "id": result["_id"],
        "name": result["stitle"],
        "category": result["CAT2"],
        "description": result["xbody"],
        "address": result["address"],
        "transport": result["info"],
        "mrt": result["MRT"],
        "latitude": result["latitude"],
        "longitude": result["longitude"],
        "images": result["file"]
    }
    try:
        cursor.execute(insert_cmd, insert_content)
        cnx.commit()
        print(f"Done Inserting {insert_content['id']} data.")
    except:
        cnx.rollback()
    
cursor.close()
cnx.close()