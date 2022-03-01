# Project Setup

As mentionned in the boilerplate readme, this project requires postgresql and redis installed.

Please refer to the orginal readme for more info.

## 1. Installing packages
1. Install packages in the root folder.

	```
	yarn install
	```

2. Delete the app folder if you're working on a pure web project.

	```bash
	rm -rf packages/app
	```

3. Install modules on the web and api packages
	```bash
	cd packages/web && yarn install
	cd ../api && yarn install # installing api packages automatically triggers a prisma generate commnd which will generate the Prisma Client
	```
## 2. Running the project
1. Run the web dev server
	```bash
	cd packages/web && yarn dev
	```
2. Before running the GraphQL API, add the connection string to your Postgresql database.

	```bash
	cp .env.example  .env
	```
	```bash
	# Replace <user>,<password> and <db-name> with your corresponding username,password, and database name of your postgresql database.
	DATABASE_URL=postgresql://john:doe@localhost:5432/postgres
	```

3. Run the API dev server

	```
	yarn dev
	```


> **_NOTE:_**  
While working on the project, you can run ``` yarn generate:watch ``` to be able to watch for any newly created queries and create the corresponding types for them.


# Feature: Add a Todo Model
This feature documentation describes how to add a `Todo` model and associate it with the a `User` model by following the conventions adopted by this boilerplate.

## 1. Backend API
First make sure you're in the root directory of the API package
```bash
cd packages/api
```

1. Add Todo model to the prisma schema located in `src/db/schema.prisma`

```prisma
model Todo {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title     String
  user      User     @relation(fields: [userId], references: [id])
  userId    String   @db.Uuid
  completed Boolean? @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @updatedAt @db.Timestamptz(6)
}
```

2. Generate a migrating by running this command

	```
	yarn db:migrate
	```
	This will apply the changes made to your prisma schema to the postgreql database and generate a new migration file under `packages/api/src/db/migrations`


3. Create a new folder under `src/modules`  called todo and create the todo model

	```bash
	mkdir src/modules/todo
	touch src/modules/todo/todo.model.ts
	```
	```typescript
	// filename:  src/modules/todo/todo.model.ts

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
	```

> **_NOTE:_**  
Using [type-graphql](https://typegraphql.com/docs/introduction.html) and classes to define a GraphQL schema as opposed to [SDL](https://graphql.org/learn/schema/) eliminates field type mismatches between your GraphQL API and our data layer, typos and annoying refactoring.





1. Add the `Todo` resolver 
 	```bash
    touch src/modules/todo/todo.resolver.ts
	touch src/modules/todo/todo.service.ts
	mkdir src/modules/todo/inputs/
	touch src/modules/todo/inputs/create.input.ts
	```
   ```typescript
   // filename: src/modules/todo/todo.resolver.ts

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
   ```
   ```typescript
   // filename: src/modules/todo/todo.service.ts 

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
   ```
	> **_NOTE:_**  
	Using a seperate class `TodoService` as opposed to writing prisma queries into our resolver functions allows us to seperate our business logic, this is much cleaner and easier to refactor in case things change in the future (using another database or ORM for example).
   
   ```typescript
   // filename: src/modules/todo/inputs/create.input.ts 

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
   ```

## 2. Frontend
First make sure you're in the root directory of the web package

```
cd packages/web
```


We can test the todo query and mutation by creating a new `/todo` page.

```typescript
// filename: src/pages/todo.tsx

import * as React from "react"
import { Box, Center, Heading, Button } from "@chakra-ui/react"
import { gql } from "@apollo/client"
import Head from "next/head"
import { TodoInput, useAllTodosQuery, useCreateTodoMutation } from "lib/graphql"
import * as c from "@chakra-ui/react"
import { Input } from "components/Input"

import { HomeLayout } from "components/HomeLayout"
import { Limiter } from "components/Limiter"
import { Form } from "components/Form"
import Yup from "lib/yup"
import { useForm } from "lib/hooks/useForm"
import { useMe } from "lib/hooks/useMe"
import { useToast } from "lib/hooks/useToast"

const _ = gql`
  mutation CreateTodo($data: TodoInput!) {
    createTodo(data: $data) {
      id
      title
      userId
    }
  }
  query AllTodos {
    allTodos {
      id
      title
      userId
    }
  }
`

export default function Todo() {
  const toast = useToast()
  const { me, loading: meLoading } = useMe()
  const [createTodo] = useCreateTodoMutation()
  const { data: todos, refetch } = useAllTodosQuery()
  const TodoSchema = Yup.object().shape({
    title: Yup.string().required("Required"),
  })

  const form = useForm({ schema: TodoSchema })

  const onSubmit = (data: TodoInput) => {
    return form.handler(() => createTodo({ variables: { data: { ...data, userId: me?.id || "" } } }), {
      onSuccess: async (responseData) => {
        toast({
          title: "Toddo created",
          description: "You recent todo was succesfully created!",
          status: "success",
        })
        refetch()
        form.reset()
      },
    })
  }

  if (meLoading)
    return (
      <c.Center>
        <c.Spinner />
      </c.Center>
    )
  if (!me) return null
  return (
    <Box>
      <Head>
        <title>Boilerplate</title>
      </Head>

      <Limiter pt={20} minH="calc(100vh - 65px)">
        <Center flexDir="column">
          <Heading as="h1" mb={4} textAlign="center">
            Create a todo
          </Heading>
          <Form onSubmit={onSubmit} {...form}>
            <c.Stack spacing={2}>
              <c.Heading as="h1">Todos</c.Heading>
              <Input autoFocus name="title" label="todo" placeholder="Buy tickets" />
              <Button
                colorScheme="purple"
                type="submit"
                isFullWidth
                isDisabled={form.formState.isSubmitting || !form.formState.isDirty}
                isLoading={form.formState.isSubmitting}
              >
                Add Todo
              </Button>
              <c.List>
                {todos?.allTodos.map((todo) => (
                  <c.ListItem key={todo.id}>{todo.title}</c.ListItem>
                ))}
              </c.List>
            </c.Stack>
          </Form>
        </Center>
      </Limiter>
    </Box>
  )
}

Home.getLayout = (page: React.ReactNode) => <HomeLayout>{page}</HomeLayout>

```

- The function `useAllTodosQuery` and `useCreateTodoMutation` are generated by `graphql-codegen` based on the `gql` query and mutation present in the file.

- We are able to create todos with `useCreateTodoMutation` and query them with `useAllTodosQuery`.

- After each newly added todo, we show a notifcation thanks to Chakra UI's toast `useChakraToast` hook which is wrapped by `useToast` to position it to the bottom right side. We are also refetching our todos using Apollo's refetch function.


# Generate Starwars names using SWAPI
This feature documentation describes how to fetch data from the star wars API 

## 1. Backend API
First make sure you're in the root directory of the API package
```bash
cd packages/api
```

1. Add Starwars model to the prisma schema located in `src/db/schema.prisma`

	```prisma
	model Starwars {
	id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
	name String
	}
	```

2. Generate a migrating by running this command

	```
	yarn db:migrate
	```

3. create the following files
	```
	mkdir src/modules/starwars
	touch src/modules/starwars/starwars.model.ts
	touch src/modules/starwars/starwars.resolver.ts
	touch src/modules/starwars/starwars.service.ts
	```

4. Add your GraphQL Starwars Model
	```typescript
	// filename: src/modules/starwars/starwars.model.ts

	import * as Prisma from "@prisma/client"
	import { Field, ObjectType } from "type-graphql"

	import { BaseModel } from "../shared/base.model"

	@ObjectType()
	export class Starwars extends BaseModel implements Prisma.Starwars {
		@Field()
		name: string
	}
	```
5. Add your GraphQL resolver and service file
   ```typescript
   // filename: src/modules/starwars/starwars.resolver.ts

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
   ``` 
   ```typescript
   // filename: src/modules/starwars/starwars.service.ts

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
   ```
## 2. Frontend
to test this, we are adding a `/starwars` page in our web package

```
cd packages/web && touch src/pages/starwars.tsx 
```

```typescript
// filename: src/pages/starwars.tsx

import * as React from "react"
import { Box, Center, Heading, Button } from "@chakra-ui/react"
import { gql } from "@apollo/client"
import Head from "next/head"
import { useGenerateStarwarsMutation, useAllStarwarsQuery } from "lib/graphql"
import * as c from "@chakra-ui/react"

import { HomeLayout } from "components/HomeLayout"
import { Limiter } from "components/Limiter"
import { Form } from "components/Form"
import { useForm } from "lib/hooks/useForm"
import { useMe } from "lib/hooks/useMe"
import { useToast } from "lib/hooks/useToast"

const _ = gql`
  mutation GenerateStarwars {
    generateStarwars {
      id
      name
    }
  }
  query AllStarwars {
    allStarwars {
      id
      name
    }
  }
`

export default function Starwars() {
  const form = useForm()
  const toast = useToast()
  const { me, loading: meLoading } = useMe()
  const [generateStarwars] = useGenerateStarwarsMutation()
  const { data: generatedStarwars, refetch } = useAllStarwarsQuery()

  const onSubmit = () => {
    return form.handler(() => generateStarwars(), {
      onSuccess: async () => {
        toast({
          title: "Starwars name generated",
          description: "You recent starwars name was succesfully created!",
          status: "success",
        })
        refetch()
        form.reset()
      },
    })
  }

  if (meLoading)
    return (
      <c.Center>
        <c.Spinner />
      </c.Center>
    )
  if (!me) return null
  return (
    <Box>
      <Head>
        <title>Boilerplate</title>
      </Head>

      <Limiter pt={20} minH="calc(100vh - 65px)">
        <Center flexDir="column">
          <Heading as="h1" mb={4} textAlign="center">
            Generate a starwars name
          </Heading>
          <Form onSubmit={onSubmit} {...form}>
            <c.Stack spacing={2}>
              <Button colorScheme="purple" type="submit" isFullWidth isLoading={form.formState.isSubmitting}>
                Generate
              </Button>
              <c.List>
                {generatedStarwars?.allStarwars.map((sw) => (
                  <c.ListItem key={sw.id}>{sw.name}</c.ListItem>
                ))}
              </c.List>
            </c.Stack>
          </Form>
        </Center>
      </Limiter>
    </Box>
  )
}

Starwars.getLayout = (page: React.ReactNode) => <HomeLayout>{page}</HomeLayout>
```