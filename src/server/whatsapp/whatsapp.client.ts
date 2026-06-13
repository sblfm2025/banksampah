export interface WhatsAppSender {
  sendText(to: string, body: string): Promise<string | undefined>;
}

export interface WhatsAppTemplateSender {
  sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    bodyParameters: string[],
  ): Promise<string | undefined>;
}

interface SendMessageResponse {
  messages?: Array<{ id: string }>;
}

export class WhatsAppCloudClient
  implements WhatsAppSender, WhatsAppTemplateSender
{
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly graphApiVersion = 'v25.0',
  ) {}

  async sendText(to: string, body: string): Promise<string | undefined> {
    return this.send({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    });
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    bodyParameters: string[],
  ): Promise<string | undefined> {
    return this.send({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: bodyParameters.map((text) => ({
              type: 'text',
              text,
            })),
          },
        ],
      },
    });
  }

  private async send(payload: Record<string, unknown>) {
    const response = await fetch(
      `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      throw new Error(`WHATSAPP_SEND_FAILED:${response.status}`);
    }

    const result = (await response.json()) as SendMessageResponse;
    return result.messages?.[0]?.id;
  }
}
