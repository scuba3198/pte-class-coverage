import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import type { AppState } from './types';

describe('App', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('selects the first stored class when the default is missing', () => {
        const storedState: AppState = {
            classes: [{ id: 'class-9-10', name: '9-10' }],
            coverage: { 'class-9-10': {} },
            sessions: { 'class-9-10': [] },
        };
        window.localStorage.setItem('pte-tracker-state-v1', JSON.stringify(storedState));

        render(<App />);

        const classButtons = screen.getAllByRole('button', { name: '9-10' });
        expect(classButtons).toHaveLength(2);
        classButtons.forEach((button) => {
            expect(button.className).toContain('active');
        });
    });
});
