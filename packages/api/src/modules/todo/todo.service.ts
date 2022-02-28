import { prisma } from "../../lib/prisma"
import { Service } from "typedi"
import { TodoInput } from "./inputs/create.input"
import { Resolver } from "type-graphql"
import { Todo } from "./todo.model"

@Service()
@Resolver(() => Todo)
export class TodoService {
  async create(data: TodoInput) {
    return await prisma.todo.create({ data })
  }

  async getAllTodos() {
    return await prisma.todo.findMany()
  }

  async getTodo(id: string) {
    return await prisma.todo.findUnique({ where: { id } })
  }
}
