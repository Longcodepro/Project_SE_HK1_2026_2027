// Cổng gửi tin ra ngoài. Hiện chỉ có bản giả lập ghi log; muốn gửi thật chỉ cần viết bản khác cho hai lớp này.
export abstract class SmsGateway {
  abstract send(phone: string, text: string): Promise<void>;
}

export abstract class EmailGateway {
  abstract send(to: string, subject: string, body: string): Promise<void>;
}
