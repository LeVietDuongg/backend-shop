from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

products = [
    {"id": 1, "name": "Áo thun nam", "price": 120000, "image": "https://th.bing.com/th/id/OIP._cFXyvl6CYFMo1QRizPoSgHaKs?rs=1&pid=ImgDetMain"},
    {"id": 2, "name": "Quần jeans nữ", "price": 350000, "image": "https://cf.shopee.vn/file/a7624da479e934e6776218d26135f4d0"},
    {"id": 3, "name": "Giày thể thao", "price": 600000, "image": "https://salt.tikicdn.com/ts/tmp/72/99/3d/6b8c1b6cc9094dc866dcbefab72fc9cc.jpg"},
    {"id": 4, "name": "Túi xách", "price": 450000, "image": "https://thuthuatnhanh.com/wp-content/uploads/2022/05/Mau-tui-xach-nu-dep-gia-re.jpg"}
]

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)