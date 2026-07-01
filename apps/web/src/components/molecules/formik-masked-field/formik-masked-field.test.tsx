import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { FormikMaskedField } from '@/components/molecules/formik-masked-field/formik-masked-field';

describe('FormikMaskedField', () => {
  it('renders the label and masks a prefilled raw value', () => {
    render(
      <Formik initialValues={{ ssn: '29537995593' }} onSubmit={() => {}}>
        <Form>
          <FormikMaskedField name="ssn" label="CPF" />
        </Form>
      </Formik>
    );

    expect(screen.getByText('CPF')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveValue('295.379.955-93');
  });

  it('masks digits while typing', async () => {
    const user = userEvent.setup();

    render(
      <Formik initialValues={{ ssn: '' }} onSubmit={() => {}}>
        <Form>
          <FormikMaskedField name="ssn" label="CPF" />
        </Form>
      </Formik>
    );

    await user.type(screen.getByLabelText('CPF'), '12345678901');

    expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-01');
  });

  it('shows the error message when invalid', async () => {
    const user = userEvent.setup();

    render(
      <Formik
        initialValues={{ ssn: '' }}
        onSubmit={() => {}}
        validationSchema={yup.object({ ssn: yup.string().required('required') })}
      >
        {() => (
          <Form>
            <FormikMaskedField name="ssn" label="CPF" />
            <button type="submit">go</button>
          </Form>
        )}
      </Formik>
    );

    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(await screen.findByText('required')).toBeInTheDocument();
  });
});
