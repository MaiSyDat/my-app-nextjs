/**
 * File export tập trung cho tất cả Mongoose models
 * 
 * File này:
 * - Import tất cả models để đảm bảo chúng được đăng ký
 * - Export models và types để sử dụng ở nơi khác
 * - Đảm bảo mongoose.models được tạo trước khi sử dụng
 * - Tránh lỗi "Schema hasn't been registered"
 */

// Import tất cả models để đảm bảo chúng được đăng ký
import User from "./User";
import Friendship from "./Friendship";
import Messenger from "./Messenger";
import PushSubscription from "./PushSubscription";

// Export để có thể import từ đây nếu cần
export { default as User } from "./User";
export { default as Friendship } from "./Friendship";
export { default as Messenger } from "./Messenger";
export { default as PushSubscription } from "./PushSubscription";

// Export types
export type { IUser } from "./User";
export type { IFriendship } from "./Friendship";
export type { IMessenger } from "./Messenger";
export type { IPushSubscription } from "./PushSubscription";

// Đảm bảo models được đăng ký bằng cách import chúng
// Điều này đảm bảo mongoose.models.User, mongoose.models.Friendship, etc. được tạo
void User;
void Friendship;
void Messenger;
void PushSubscription;

