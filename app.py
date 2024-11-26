from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
import os

app = Flask(__name__)
CORS(app)

# Cấu hình ứng dụng
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///data.db')  # Database mặc định SQLite
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

# Khởi tạo cơ sở dữ liệu và JWT
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Sản phẩm mẫu
products = [
    {"id": 1, "name": "Áo thun nam", "price": 120000, "image": "https://th.bing.com/th/id/OIP._cFXyvl6CYFMo1QRizPoSgHaKs?rs=1&pid=ImgDetMain"},
    {"id": 2, "name": "Quần jeans nữ", "price": 350000, "image": "https://cf.shopee.vn/file/a7624da479e934e6776218d26135f4d0"},
    {"id": 3, "name": "Giày thể thao", "price": 600000, "image": "https://salt.tikicdn.com/ts/tmp/72/99/3d/6b8c1b6cc9094dc866dcbefab72fc9cc.jpg"},
    {"id": 4, "name": "Túi xách", "price": 450000, "image": "https://thuthuatnhanh.com/wp-content/uploads/2022/05/Mau-tui-xach-nu-dep-gia-re.jpg"}
]

# Model quản lý User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

# Tạo bảng dữ liệu
@app.before_first_request
def create_tables():
    db.create_all()

# Endpoint lấy danh sách sản phẩm
@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products)

# Endpoint đăng ký
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Tài khoản đã tồn tại'}), 400
    user = User(username=data['username'], password=data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Tài khoản đã được tạo'})

# Endpoint đăng nhập
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username'], password=data['password']).first()
    if not user:
        return jsonify({'message': 'Tên đăng nhập hoặc mật khẩu không chính xác'}), 401
    access_token = create_access_token(identity={'username': user.username})
    return jsonify(access_token=access_token)

# Endpoint bảo vệ (yêu cầu đăng nhập)
@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    return jsonify({'message': 'Bạn đã truy cập thành công vào endpoint bảo vệ'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
