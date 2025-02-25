import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DetailsDialogProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: T | null
  title: string
  renderDetails: (data: T) => React.ReactNode
}

export function DetailsDialog<T>({ 
  open, 
  onOpenChange, 
  data, 
  title,
  renderDetails 
}: DetailsDialogProps<T>) {
  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {renderDetails(data)}
      </DialogContent>
    </Dialog>
  )
}

