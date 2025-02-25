"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCompanies, type Company, type CompanyFormData } from "@/hooks/use-companies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  active: z.boolean().default(true),
});

type EditCompanyFormValues = z.infer<typeof formSchema>;

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
}: EditCompanyDialogProps) {
  const { updateCompany, isUpdating } = useCompanies();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditCompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });

  // Update form values when company changes
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        active: company.active,
      });
    }
  }, [company, form]);

  const onSubmit = async (data: EditCompanyFormValues) => {
    if (!company) return;
    
    setError(null);
    try {
      await updateCompany.mutateAsync({
        id: company.id,
        data: data as CompanyFormData,
      });
      onOpenChange(false);
    } catch (err) {
      setError("Failed to update company. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update the company information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Company will be available in the system
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 