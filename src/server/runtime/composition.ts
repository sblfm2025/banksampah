import { GeminiWasteAnalyzer } from '../ai/waste-analysis.service';
import { PickupReminderService } from '../services/pickup-reminder.service';
import { PickupTicketService } from '../services/pickup-ticket.service';
import { WhatsAppIntakeService } from '../whatsapp/intake.service';
import { WhatsAppMediaService } from '../whatsapp/media.service';
import { WhatsAppMessageService } from '../whatsapp/message.service';
import { WhatsAppCloudClient } from '../whatsapp/whatsapp.client';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} belum dikonfigurasi.`);
  }
  return value;
}

export function createWhatsAppIntakeService(): WhatsAppIntakeService {
  const accessToken = requiredEnv('WHATSAPP_ACCESS_TOKEN');
  const graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || 'v25.0';

  return new WhatsAppIntakeService(
    new WhatsAppMessageService(),
    new WhatsAppMediaService(accessToken, graphApiVersion),
    new GeminiWasteAnalyzer(
      requiredEnv('GEMINI_API_KEY'),
      process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
    ),
    new PickupTicketService(),
    new WhatsAppCloudClient(
      accessToken,
      requiredEnv('WHATSAPP_PHONE_NUMBER_ID'),
      graphApiVersion,
    ),
  );
}

export function createPickupReminderService(): PickupReminderService {
  const accessToken = requiredEnv('WHATSAPP_ACCESS_TOKEN');
  const graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || 'v25.0';
  const client = new WhatsAppCloudClient(
    accessToken,
    requiredEnv('WHATSAPP_PHONE_NUMBER_ID'),
    graphApiVersion,
  );

  return new PickupReminderService(
    client,
    new WhatsAppMessageService(),
    undefined,
    undefined,
    requiredEnv('WHATSAPP_REMINDER_TEMPLATE_NAME'),
    process.env.WHATSAPP_REMINDER_TEMPLATE_LANGUAGE?.trim() || 'id',
  );
}
