import { describe, it, expect, vi, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import MessageBubble from './MessageBubble.vue';
import type { Message, ToolCallTrace } from '../types/index';

// Far enough ahead that "future slots only" never filters them out.
const slotsCall: ToolCallTrace = {
  tool: 'lister_creneaux_disponibles',
  arguments: { start: '2099-01-05', end: '2099-01-09' },
  status: 'completed',
  output: {
    status_code: 200,
    response_data: {
      data: {
        '2099-01-05': [
          { start: '2099-01-05T09:00:00.000+01:00' },
          { start: '2099-01-05T14:30:00.000+01:00' },
        ],
      },
    },
  },
};

const bookingCall = (
  output: unknown = { response_data: { data: { end: '2099-01-05T14:30:00.000Z' } } },
): ToolCallTrace => ({
  tool: 'planifier_entretien',
  arguments: { start_time: '2099-01-05T14:00:00.000Z', attendee_name: 'Camille Martin' },
  status: 'completed',
  output,
});

const assistantMessage = (toolCalls?: ToolCallTrace[]): Message => ({
  id: 'a1',
  content: 'Voici des créneaux.',
  role: 'assistant',
  timestamp: new Date('2099-01-01T10:00:00Z'),
  toolCalls,
});

const mount = (message: Message, props: Record<string, unknown> = {}) =>
  mountSuspended(MessageBubble, { props: { message, isLast: true, ...props } });

afterEach(() => vi.restoreAllMocks());

describe('MessageBubble: slot chips', () => {
  it('renders one chip per slot returned by lister_creneaux_disponibles', async () => {
    const wrapper = await mount(assistantMessage([slotsCall]));
    const chips = wrapper.findAll('[role="group"] button');

    expect(chips).toHaveLength(2);
  });

  it('emits selectSlot with the exact datetime Cal.eu returned when a chip is clicked', async () => {
    const wrapper = await mount(assistantMessage([slotsCall]));

    await wrapper.findAll('[role="group"] button')[1]!.trigger('click');

    const [iso, label] = wrapper.emitted('selectSlot')![0]!;
    expect(iso).toBe('2099-01-05T14:30:00.000+01:00');
    expect(label).toEqual(expect.stringContaining('janvier'));
  });

  it('shows no chips when the tool returned nothing recognisable', async () => {
    const wrapper = await mount(
      assistantMessage([
        { ...slotsCall, output: { response_data: { data: { message: 'rien' } } } },
      ]),
    );

    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });

  it('shows chips only on the last message, not on restored history above it', async () => {
    const wrapper = await mount(assistantMessage([slotsCall]), { isLast: false });

    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });

  it('hides chips while the reply is still streaming', async () => {
    const wrapper = await mount(assistantMessage([slotsCall]), { isStreaming: true });

    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });

  it('hides chips while the identity card is the expected way to answer', async () => {
    const wrapper = await mount(assistantMessage([slotsCall]), { awaitingIdentity: true });

    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });
});

describe('MessageBubble: add to calendar', () => {
  it('offers the button on the confirmation card', async () => {
    const wrapper = await mount(assistantMessage([bookingCall()]));

    expect(wrapper.text()).toContain('Camille Martin');
    expect(wrapper.text()).toContain('Ajouter à mon calendrier');
  });

  it('downloads an .ics for the booked slot, ending at the end Cal.eu returned', async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      blob = b as Blob;

      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const wrapper = await mount(assistantMessage([bookingCall()]));
    const button = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Ajouter à mon calendrier'))!;
    await button.trigger('click');

    expect(click).toHaveBeenCalledOnce();
    const ics = await blob!.text();
    expect(ics).toContain('DTSTART:20990105T140000Z');
    expect(ics).toContain('DTEND:20990105T143000Z');
    expect(ics).toContain('SUMMARY:Échange avec Maxime Jolivet');
    expect(ics).toContain('UID:booking-');
  });

  it('is not offered when the booking start is not a valid date', async () => {
    const call = {
      ...bookingCall(),
      arguments: { start_time: 'demain', attendee_name: 'Camille Martin' },
    };
    const wrapper = await mount(assistantMessage([call]));

    expect(wrapper.text()).toContain('Camille Martin');
    expect(wrapper.text()).not.toContain('Ajouter à mon calendrier');
  });

  it('is not offered on a message without a completed booking', async () => {
    const wrapper = await mount(assistantMessage([{ ...bookingCall(), status: 'failed' }]));

    expect(wrapper.text()).not.toContain('Ajouter à mon calendrier');
  });
});
