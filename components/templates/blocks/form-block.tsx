import type { ChangeEvent } from "react";
import type { FormField, FormSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { Textarea } from "@/components/retroui/Textarea";

type FormRuntime = Record<string, string>;

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        placeholder={field.placeholder}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        rows={3}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue ?? "")}
      >
        <Select.Trigger className="w-full min-w-0">
          <Select.Value placeholder={field.placeholder ?? "Select an option"} />
        </Select.Trigger>
        <Select.Content>
          {(field.options ?? []).map((option) => (
            <Select.Item key={option} value={option}>
              {option}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    );
  }

  return (
    <Input
      id={field.id}
      type={field.type}
      placeholder={field.placeholder}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  );
}

export function FormBlock({
  section,
  runtime,
  onRuntimeChange,
}: {
  section: FormSection;
  runtime: FormRuntime;
  onRuntimeChange: (runtime: FormRuntime) => void;
}) {
  const updateField = (fieldId: string, value: string) => {
    onRuntimeChange({ ...runtime, [fieldId]: value });
  };

  return (
    <BlockShell title={section.title}>
      <div className="grid gap-4 md:grid-cols-2">
        {section.fields.map((field) => (
          <div
            key={field.id}
            className={field.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            <label
              htmlFor={field.id}
              className="mb-1.5 block font-head text-sm font-medium leading-none"
            >
              {field.label}
            </label>
            <FieldInput
              field={field}
              value={runtime[field.id] ?? ""}
              onChange={(value) => updateField(field.id, value)}
            />
          </div>
        ))}
      </div>
    </BlockShell>
  );
}
