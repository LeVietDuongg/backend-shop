# Hướng dẫn triển khai mạng xã hội trên Netlify

Tài liệu này hướng dẫn cách triển khai ứng dụng mạng xã hội của bạn lên Netlify thông qua GitHub.

## Bước 1: Đưa mã nguồn lên GitHub

1. Tạo một repository mới trên GitHub
   - Truy cập https://github.com/new
   - Đặt tên repository (ví dụ: "social-network")
   - Chọn "Public" hoặc "Private" tùy theo nhu cầu
   - Nhấn "Create repository"

2. Đẩy mã nguồn lên GitHub
   ```bash
   # Đã thực hiện các bước sau trong mã nguồn
   # git init
   # git add .
   # git commit -m "Initial commit of social network application"
   
   # Thêm remote repository
   git remote add origin https://github.com/YOUR_USERNAME/social-network.git
   
   # Đẩy mã nguồn lên GitHub
   git push -u origin master
   ```

## Bước 2: Triển khai trên Netlify

1. Đăng nhập vào Netlify
   - Truy cập https://app.netlify.com/
   - Đăng nhập bằng tài khoản GitHub của bạn

2. Tạo site mới từ GitHub
   - Nhấn "Add new site" > "Import an existing project"
   - Chọn "GitHub" làm nguồn triển khai
   - Cấp quyền truy cập cho Netlify nếu được yêu cầu
   - Chọn repository "social-network" của bạn

3. Cấu hình triển khai
   - Netlify sẽ tự động phát hiện cấu hình từ file `netlify.toml`
   - Kiểm tra các cài đặt:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Nhấn "Deploy site"

4. Cấu hình biến môi trường
   - Sau khi site được tạo, vào "Site settings" > "Environment variables"
   - Thêm các biến môi trường sau:
     - `JWT_SECRET`: Một chuỗi ngẫu nhiên dùng để mã hóa JWT
     - `NEXT_PUBLIC_SOCKET_URL`: URL của site Netlify của bạn
     - `NEXT_PUBLIC_API_URL`: URL của site Netlify của bạn

## Bước 3: Cấu hình cơ sở dữ liệu

Vì Netlify không cung cấp cơ sở dữ liệu D1 như Cloudflare, bạn cần sử dụng một dịch vụ cơ sở dữ liệu bên ngoài:

1. Tùy chọn 1: Sử dụng Supabase
   - Đăng ký tại https://supabase.com/
   - Tạo dự án mới
   - Thực thi script SQL từ file `migrations/0001_initial.sql`
   - Cập nhật mã nguồn để sử dụng Supabase thay vì D1

2. Tùy chọn 2: Sử dụng PlanetScale
   - Đăng ký tại https://planetscale.com/
   - Tạo cơ sở dữ liệu mới
   - Thực thi script SQL từ file `migrations/0001_initial.sql`
   - Cập nhật mã nguồn để sử dụng PlanetScale thay vì D1

3. Thêm biến môi trường cơ sở dữ liệu vào Netlify
   - Vào "Site settings" > "Environment variables"
   - Thêm thông tin kết nối cơ sở dữ liệu (URL, username, password)

## Bước 4: Cấu hình Socket.IO

Để Socket.IO hoạt động trên Netlify, bạn cần một dịch vụ hỗ trợ WebSocket:

1. Tùy chọn 1: Sử dụng Heroku
   - Đăng ký tại https://heroku.com/
   - Tạo ứng dụng mới
   - Triển khai server Socket.IO (file `src/server.js`)
   - Cập nhật biến môi trường `NEXT_PUBLIC_SOCKET_URL` trên Netlify

2. Tùy chọn 2: Sử dụng Render
   - Đăng ký tại https://render.com/
   - Tạo Web Service mới
   - Triển khai server Socket.IO (file `src/server.js`)
   - Cập nhật biến môi trường `NEXT_PUBLIC_SOCKET_URL` trên Netlify

## Bước 5: Kiểm tra và xử lý lỗi

1. Kiểm tra logs triển khai
   - Vào "Deploys" > chọn triển khai mới nhất > "Deploy log"
   - Xem lỗi nếu có và khắc phục

2. Kiểm tra ứng dụng
   - Truy cập URL của site Netlify
   - Kiểm tra các chức năng: đăng ký, đăng nhập, bài viết, kết bạn, tin nhắn, tìm kiếm

## Lưu ý quan trọng

- Netlify Functions có giới hạn thời gian chạy 10 giây, có thể không đủ cho một số tác vụ
- Netlify không hỗ trợ WebSocket nên cần dịch vụ bên ngoài cho Socket.IO
- Cân nhắc sử dụng Vercel thay vì Netlify nếu gặp vấn đề với WebSocket hoặc serverless functions

## Tài nguyên bổ sung

- [Tài liệu Netlify Next.js](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Tài liệu Supabase](https://supabase.com/docs)
- [Tài liệu PlanetScale](https://planetscale.com/docs)
- [Tài liệu Socket.IO](https://socket.io/docs/)
