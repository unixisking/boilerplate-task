import * as Prisma from "@prisma/client"
import { Field, ObjectType } from "type-graphql"

import { BaseModel } from "../shared/base.model"

@ObjectType()
export class Todo extends BaseModel implements Prisma.Todo {
  @Field()
  title: string

  @Field()
  userId: string

  @Field()
  completed: boolean
}
