import { prisma } from "../../lib/prisma"
import { Service } from "typedi"
import { Resolver } from "type-graphql"
import { Starwars } from "./starwars.model"
import { ApolloError } from "apollo-server-express"
import fetch from "node-fetch"

@Service()
@Resolver(() => Starwars)
export class StarwarsService {
  async getAllStarwars() {
    return await prisma.starwars.findMany()
  }
  async generateStarwars() {
    const res = await fetch(`https://swapi.dev/api/people/${Math.floor(Math.random() * 50) + 1}/`)
    const data = await res.json()
    if (!data) throw new ApolloError("no data")
    return await prisma.starwars.create({ data: { name: data.name } })
  }
}
