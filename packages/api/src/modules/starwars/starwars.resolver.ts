import { Mutation, Query, Resolver } from "type-graphql"
import { Starwars } from "./starwars.model"
import { Inject, Service } from "typedi"
import { StarwarsService } from "./starwars.service"

@Service()
@Resolver(() => Starwars)
export default class StarwarsResolver {
  @Inject(() => StarwarsService)
  starwarsService: StarwarsService

  @Mutation(() => Starwars)
  async generateStarwars() {
    return await this.starwarsService.generateStarwars()
  }

  @Query(() => [Starwars])
  async allStarwars() {
    return await this.starwarsService.getAllStarwars()
  }
}
