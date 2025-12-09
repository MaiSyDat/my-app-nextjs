/**
 * File import tập trung cho tất cả Mongoose models
 * 
 * File này:
 * - Import tất cả models để đảm bảo chúng được đăng ký
 * - Đảm bảo mongoose.models được tạo trước khi sử dụng
 * - Tránh lỗi "Schema hasn't been registered"
 * - Models được import trực tiếp từ các file riêng lẻ trong codebase
 */

// Import tất cả models để đảm bảo chúng được đăng ký
import User from "./User";
import Friendship from "./Friendship";
import Messenger from "./Messenger";
import PushSubscription from "./PushSubscription";

// Đảm bảo models được đăng ký bằng cách import chúng
// Điều này đảm bảo mongoose.models.User, mongoose.models.Friendship, etc. được tạo
// Models được import trực tiếp từ các file riêng lẻ trong codebase
void User;
void Friendship;
void Messenger;
void PushSubscription;

