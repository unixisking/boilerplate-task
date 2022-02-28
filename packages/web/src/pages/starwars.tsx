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

export default function Home() {
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

Home.getLayout = (page: React.ReactNode) => <HomeLayout>{page}</HomeLayout>
