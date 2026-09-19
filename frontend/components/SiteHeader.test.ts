import { describe, it, expect, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import SiteHeader from './SiteHeader.vue';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

afterEach(() => scrollTo(0));

describe('SiteHeader', () => {
  it('links the portfolio and the CV as two CTAs', async () => {
    const wrapper = await mountSuspended(SiteHeader);
    const links = wrapper.findAll('nav a');

    expect(links).toHaveLength(2);
    expect(links[0]!.attributes('href')).toBe('https://maxime.bzh');
    expect(links[0]!.text()).toBe('Portfolio');
    expect(links[1]!.attributes('href')).toBe(CV_URL);
    expect(links[1]!.attributes('target')).toBe('_blank');
    expect(links[1]!.attributes('rel')).toBe('noopener');
  });

  it('shows the arrow on the CV CTA only', async () => {
    const wrapper = await mountSuspended(SiteHeader);
    const [portfolio, cv] = wrapper.findAll('nav a');

    expect(portfolio!.find('svg').exists()).toBe(false);
    expect(cv!.find('svg').exists()).toBe(true);
  });

  it('hides on scroll down and comes back on scroll up', async () => {
    const wrapper = await mountSuspended(SiteHeader, { attachTo: document.body });
    const header = wrapper.find('header');

    expect(header.classes()).toContain('translate-y-0');

    scrollTo(300);
    await nextTick();
    expect(header.classes()).toContain('-translate-y-full');

    scrollTo(200);
    await nextTick();
    expect(header.classes()).toContain('translate-y-0');

    wrapper.unmount();
  });

  it('stays visible near the top of the page', async () => {
    const wrapper = await mountSuspended(SiteHeader, { attachTo: document.body });

    scrollTo(40);
    await nextTick();
    expect(wrapper.find('header').classes()).toContain('translate-y-0');

    wrapper.unmount();
  });
});
