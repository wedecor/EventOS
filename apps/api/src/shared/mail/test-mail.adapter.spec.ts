import { TestMailAdapter } from './test-mail.adapter';

describe('TestMailAdapter', () => {
  it('captures accepted messages without claiming delivery', async () => {
    const adapter = new TestMailAdapter();
    const result = await adapter.send({
      to: 'customer@example.test',
      subject: 'Quote',
      text: 'Attached',
      html: '<p>Attached</p>',
      attachments: [
        {
          filename: 'q.pdf',
          content: Buffer.from('%PDF'),
          contentType: 'application/pdf',
        },
      ],
    });
    expect(result.accepted).toBe(true);
    expect(result.status).toBe('accepted');
    expect(result.provider).toBe('test');
    expect(adapter.sent).toHaveLength(1);
    expect(adapter.sent[0]?.attachments?.[0]?.filename).toBe('q.pdf');
  });

  it('can force provider failure', async () => {
    const adapter = new TestMailAdapter();
    adapter.failNext = true;
    const result = await adapter.send({
      to: 'customer@example.test',
      subject: 'Quote',
      text: 'x',
      html: '<p>x</p>',
    });
    expect(result.accepted).toBe(false);
    expect(result.status).toBe('failed');
    expect(adapter.sent).toHaveLength(0);
  });
});
