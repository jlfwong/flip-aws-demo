import { cn } from "@/lib/shadcn";
import { HTMLAttributes, forwardRef } from "react";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {}

const List = forwardRef<HTMLUListElement, ListProps>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
        {...props}
      />
    );
  }
);
List.displayName = "List";

export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {}

const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, ...props }, ref) => {
    return <li ref={ref} className={cn("", className)} {...props} />;
  }
);
ListItem.displayName = "ListItem";

export { List, ListItem };
