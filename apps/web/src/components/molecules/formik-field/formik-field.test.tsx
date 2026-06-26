import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { FormikField } from '@/components/molecules/formik-field/formik-field';

describe('FormikField', () => {
  it('renders the label and the input', () => {
    render(
      <Formik initialValues={{ x: '' }} onSubmit={() => {}}>
        <Form>
          <FormikField name="x" label="Name" />
        </Form>
      </Formik>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows the error message when invalid', async () => {
    const user = userEvent.setup();

    render(
      <Formik
        initialValues={{ x: '' }}
        onSubmit={() => {}}
        validationSchema={yup.object({ x: yup.string().required('required') })}
      >
        {() => (
          <Form>
            <FormikField name="x" label="Name" />
            <button type="submit">go</button>
          </Form>
        )}
      </Formik>
    );

    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(await screen.findByText('required')).toBeInTheDocument();
  });
});
