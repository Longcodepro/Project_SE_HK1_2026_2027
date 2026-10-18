import { Injectable, Logger } from '@nestjs/common';
import { EmailGateway, SmsGateway } from '../domain/gateways';

@Injectable()
export class MockSmsGateway implements SmsGateway {
  private readonly log = new Logger('SMS');

  async send(phone: string, text: string) {
    this.log.log(`→ ${phone}: ${text}`);
  }
}

@Injectable()
export class MockEmailGateway implements EmailGateway {
  private readonly log = new Logger('Email');

  async send(to: string, subject: string, body: string) {
    this.log.log(`→ ${to} | ${subject} | ${body.slice(0, 80)}`);
  }
}
