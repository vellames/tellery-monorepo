import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { CheckboxField } from '@/components/molecules/checkbox-field/checkbox-field';

describe('CheckboxField', () => {
  it('toggles the value through Formik and clears the error', async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();

    render(
      <Formik
        initialValues={{ terms: false }}
        onSubmit={(values) => submitted(values)}
        validationSchema={yup.object({
          terms: yup.boolean().oneOf([true], 'must accept'),
        })}
      >
        {() => (
          <Form>
            <CheckboxField name="terms" label="accept" />
            <button type="submit">go</button>
          </Form>
        )}
      </Formik>
    );

    await user.click(screen.getByRole('button', { name: 'go' }));
    expect(await screen.findByText('must accept')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(submitted).toHaveBeenCalledWith({ terms: true });
  });
});
