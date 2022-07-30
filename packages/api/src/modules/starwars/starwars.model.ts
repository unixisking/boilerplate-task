import * as Prisma from "@prisma/client"
import { Field, ObjectType } from "type-graphql"

import { BaseModel } from "../shared/base.model"

@ObjectType()
export class Starwars extends BaseModel implements Prisma.Starwars {
  @Field()
  name: string
}
