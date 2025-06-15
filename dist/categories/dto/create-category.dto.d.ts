import { CategoryType } from "@prisma/client";
export declare class CreateCategoryDto {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    type: CategoryType;
    parentId?: string;
    isActive?: boolean;
}
