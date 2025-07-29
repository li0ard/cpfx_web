<script setup lang="ts">
import { CircleAlert } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import PfxComponent from "@/components/PfxComponent.vue"
import ContainerComponent from "@/components/ContainerComponent.vue"
</script>

<template>
    <header class="sticky z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border">
        <div class="container flex h-14 max-w-screen-2xl items-center">
            <div class="mr-4 md:mr-1 md:flex">
                <a href="/" class="ml-4 mr-4 md:mr-2 lg:mr-6 flex items-center lg:space-x1 xl:space-x-2"><span class="font-bold"> cpfx web</span></a>
            </div>
        </div>
    </header>
    <div class="flex min-h-screen flex-col bg-background">
        <div class="flex-1 bg-background">
            <main class="w-full">
                <div class="relative">
                    <div class="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 page-header pb-8 page-header pb-8">
                        <img class="w-[128px]" src="/unlock.webp" />
                        <h1 class="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">cpfx web</h1>
                        <span class="max-w-[750px] text-center text-lg font-light text-foreground">
                            Извлечение приватного ключа из контейнеров КриптоПро
                        </span>
                        <Tabs default-value="pfx" class="mt-5 w-[400px] max-sm:p-3 max-sm:w-full">
                            <TabsList class="grid w-full grid-cols-2">
                                <TabsTrigger value="pfx">PKCS#12 (.p12/.pfx)</TabsTrigger>
                                <TabsTrigger value="key">Контейнер (.key)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pfx"><PfxComponent /></TabsContent>
                            <TabsContent value="key"><ContainerComponent /></TabsContent>
                        </Tabs>
                        <div class="mt-5 w-[414px] max-sm:w-full max-sm:p-3 max-w-[750px] text-sm font-light">
                            <Alert>
                                <CircleAlert class="h-4 w-4" />
                                <AlertTitle>Внимание!</AlertTitle>
                                <AlertDescription>Все операции производятся локально в вашем браузере. Ваш приватный ключ не покидает эту вкладку!</AlertDescription>
                            </Alert>
                        </div>
                        <div class="mt-5 max-w-[750px] text-center text-sm font-light text-gray-500">
                            <p><a href="https://github.com/li0ard/cpfx_web" class="underline">GitHub</a></p>
                            <p>&copy; {{ new Date().getFullYear() }} <a href="https://li0ard.rest" target="_blank" class="underline">li0ard</a></p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<style>
* {
    font-family: "Golos Text", sans-serif;
}
</style>
