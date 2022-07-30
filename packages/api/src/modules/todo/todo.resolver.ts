import { Arg, Mutation, Query, Resolver } from "type-graphql"
import { Todo } from "./todo.model"
import { TodoInput } from "./inputs/create.input"
import { TodoService } from "./todo.service"
import { Inject, Service } from "typedi"

@Service()
@Resolver(() => Todo)
export default class TodoResolver {
  @Inject(() => TodoService)
  todoService: TodoService

  @Query(() => [Todo])
  async allTodos() {
    return await this.todoService.getAllTodos()
  }

  @Query(() => Todo)
  async todo(@Arg("id") id: string) {
    return this.todoService.getTodo(id)
  }

  @Mutation(() => Todo)
  async createTodo(@Arg("data") data: TodoInput) {
    return await this.todoService.create(data)
  }
}
