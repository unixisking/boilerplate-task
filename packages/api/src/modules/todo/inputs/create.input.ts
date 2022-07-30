import { IsNotEmpty } from "class-validator"
import { Field, InputType } from "type-graphql"

import { Todo } from "../todo.model"

@InputType()
export class TodoInput implements Partial<Todo> {
  @IsNotEmpty()
  @Field()
  title: string

  @IsNotEmpty()
  @Field()
  userId: string
}
