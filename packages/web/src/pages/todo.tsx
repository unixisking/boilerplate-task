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

export default function Home() {
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
