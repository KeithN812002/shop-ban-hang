# Checklist phân tích yêu cầu

Dùng để quét đặc tả thô. Mỗi dòng trả lời được từ input → ghi vào FS. Không trả lời được → `[Giả định]` hoặc `Q-xx`. Câu nào ảnh hưởng data model, luồng, quyền hoặc phạm vi → ưu tiên hỏi.

## 1. Mục tiêu & phạm vi
- Vấn đề nghiệp vụ cần giải quyết là gì? Ai hưởng lợi?
- Cái gì **trong** phạm vi, cái gì **ngoài** phạm vi (để lại giai đoạn sau)?
- Thay thế quy trình/hệ thống cũ nào? Có cần chuyển dữ liệu cũ không?

## 2. Actor & phân quyền
- Những vai trò nào dùng? Nội bộ hay người dùng bên ngoài?
- Mỗi vai trò được xem / tạo / sửa / xoá / duyệt gì?
- Có giới hạn dữ liệu theo đơn vị/người tạo không (chỉ thấy bản ghi của mình/đơn vị mình)?

## 3. Đối tượng dữ liệu
- **Đã có thiết kế DB chưa?** (DDL, data dictionary, ERD, DB đang chạy, entity trong code). Có → chế độ A, chưa → chế độ B (`db-design-guide.md`).
- DB có sẵn: ai là chủ DB, có được phép thêm/sửa cột không?
- Thực thể chính, thực thể con, quan hệ (1-n, n-n)?
- Trường bắt buộc, độ dài, định dạng, duy nhất (theo phạm vi nào)?
- Trường tính toán hay nhập tay? Mã tự sinh theo quy tắc nào?
- Danh mục dùng chung (dropdown) lấy từ đâu — cố định hay quản trị được?
- File đính kèm: loại, dung lượng, số lượng?
- Xoá cứng hay xoá mềm? Xoá khi đã có dữ liệu liên quan thì sao?

## 4. Vòng đời & trạng thái
- Các trạng thái? Trạng thái khởi tạo, kết thúc?
- Ai chuyển trạng thái nào, điều kiện gì? Có quay lui/trả lại không?
- Ở trạng thái nào thì được sửa/xoá?
- Có cần lịch sử thao tác / nhật ký thay đổi không?

## 5. Quy tắc nghiệp vụ
- Ràng buộc chéo trường, chéo bản ghi (trùng lặp, chồng thời gian, hạn mức)?
- Quy tắc tính toán (công thức, làm tròn, đơn vị)?
- Hạn xử lý / SLA, nhắc hạn?

## 6. Màn hình & thao tác
- Danh sách: lọc theo gì, cột nào, sắp xếp mặc định, phân trang?
- Chi tiết / form: bố cục, trường chỉ đọc theo trạng thái?
- Thao tác hàng loạt? Xuất Excel/PDF? Nhập từ Excel?
- Thông báo xác nhận trước khi thực hiện thao tác nguy hiểm?

## 7. Thông báo & tích hợp
- Gửi email/thông báo khi nào, cho ai, nội dung gồm biến gì?
- Tích hợp hệ thống ngoài: chiều nào, giao thức, tần suất, xử lý khi lỗi?

## 8. Báo cáo
- Chỉ tiêu, bộ lọc, mức tổng hợp, định dạng xuất?

## 9. Phi chức năng
- Khối lượng dữ liệu dự kiến, số người dùng đồng thời?
- Thời gian phản hồi mong muốn?
- Bảo mật dữ liệu nhạy cảm (che, mã hoá, nhật ký truy cập)?
- Lưu trữ bao lâu?

## 10. Ngoại lệ
- Dữ liệu không tồn tại / đã bị người khác sửa / đã đổi trạng thái?
- Không có quyền? Phiên hết hạn giữa chừng?
- Tích hợp ngoài lỗi hoặc chậm?
