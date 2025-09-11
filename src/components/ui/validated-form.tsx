import React from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
}

interface ValidatedFormProps<T extends Record<string, any>> {
  schema: z.ZodSchema<T>;
  fields: FormFieldConfig[];
  onSubmit: (data: T) => Promise<void> | void;
  defaultValues?: Partial<T>;
  loading?: boolean;
  submitText?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ValidatedForm<T extends Record<string, any>>({
  schema,
  fields,
  onSubmit,
  defaultValues,
  loading = false,
  submitText = "Valider",
  className = "",
  children
}: ValidatedFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case 'textarea':
                    return (
                      <Textarea
                        {...formField}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        className="min-h-[100px]"
                      />
                    );
                  
                  case 'select':
                    return (
                      <Select
                        onValueChange={formField.onChange}
                        defaultValue={formField.value}
                        disabled={field.disabled || loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  
                  case 'checkbox':
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled || loading}
                        />
                        <label
                          htmlFor={field.name}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {field.placeholder}
                        </label>
                      </div>
                    );
                  
                  case 'number':
                    return (
                      <Input
                        {...formField}
                        type="number"
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
                      />
                    );
                  
                  case 'date':
                    return (
                      <Input
                        {...formField}
                        type="date"
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        onChange={(e) => formField.onChange(new Date(e.target.value))}
                        value={formField.value ? new Date(formField.value).toISOString().split('T')[0] : ''}
                      />
                    );
                  
                  default:
                    return (
                      <Input
                        {...formField}
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                      />
                    );
                }
              })()}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-6 ${className}`}>
        {fields.map(renderField)}
        
        {children}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitText}
        </Button>
      </form>
    </Form>
  );
}

// Hook pour utiliser facilement les validations
export const useFormValidation = <T extends Record<string, any>>(schema: z.ZodSchema<T>) => {
  return {
    validate: (data: unknown): T => {
      return schema.parse(data);
    },
    safeParse: (data: unknown) => {
      return schema.safeParse(data);
    },
    getErrorMessages: (error: z.ZodError) => {
      return error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
    }
  };
};