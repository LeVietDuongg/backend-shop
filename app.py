from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as PyJWT
import datetime
from functools import wraps
import os

app = Flask(__name__)

# Cấu hình cơ sở dữ liệu từ Railway (MySQL)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'mysql+pymysql://root:aLwOoKTFJZhjZBzXKwokLvQFdrBKPZYQ@junction.proxy.rlwy.net:57235/railway'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('JWT_SECRETKEY', 'mysecretkey')

db = SQLAlchemy(app)

# ------------------------
# Mô hình cơ sở dữ liệu
# ------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(200), nullable=True)

# ------------------------
# Middleware kiểm tra Token
# ------------------------

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token:
            token = token.replace('Bearer ', '')  # Loại bỏ chữ "Bearer "
        else:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = PyJWT.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# ------------------------
# API đăng ký
# ------------------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Tên đăng nhập đã tồn tại!'}), 409

    hashed_password = generate_password_hash(password, method='sha256')
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Đăng ký thành công!'}), 201

# ------------------------
# API đăng nhập
# ------------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Tên đăng nhập hoặc mật khẩu không đúng!'}), 401

    token = PyJWT.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # Token hết hạn sau 24 giờ
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})

# ------------------------
# API lấy danh sách sản phẩm
# ------------------------

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    product_list = [{
        'id': product.id,
        'name': product.name,
        'price': product.price,
        'image': product.image
    } for product in products]

    return jsonify(product_list)

# ------------------------
# Khởi tạo cơ sở dữ liệu
# ------------------------

@app.before_request
def create_tables():
    with app.app_context():
        db.create_all()
        if not Product.query.first():
            sample_products = [
                Product(name='Áo Thun', price=150000, image='https://example.com/ao-thun.jpg'),
                Product(name='Quần Jean', price=350000, image='https://example.com/quan-jean.jpg'),
                Product(name='Giày Sneaker', price=1200000, image='https://example.com/giay-sneaker.jpg'),
            ]
            db.session.add_all(sample_products)
            db.session.commit()

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
