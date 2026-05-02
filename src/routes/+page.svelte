<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import PfxComponent from "$lib/components/PfxComponent.svelte";
    import ContainerComponent from "$lib/components/ContainerComponent.svelte";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
</script>
<Header />
<div class="flex min-h-screen flex-col bg-background">
    <div class="flex-1 bg-background">
        <main class="w-full">
            <div class="relative">
                <div class="mx-auto flex max-w-245 flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 page-header page-header pb-8">
                    <img class="w-32" src="/cpfx_web/unlock.webp" alt="" />
                    <h1 class="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">cpfx web</h1>
                    <span class="max-w-187.5 text-center text-lg font-light text-foreground">
                        Извлечение приватного ключа из контейнеров КриптоПро
                    </span>
                    <Tabs value="pfx" class="mt-5 w-100 max-sm:p-3 max-sm:w-full">
                        <TabsList class="grid w-full grid-cols-2">
                            <TabsTrigger value="pfx">PKCS#12 (.p12/.pfx)</TabsTrigger>
                            <TabsTrigger value="key">Контейнер (.key)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pfx">
                            <PfxComponent />
                        </TabsContent>
                        <TabsContent value="key">
                            <ContainerComponent />
                        </TabsContent>
                    </Tabs>
                    <Footer />
                </div>
            </div>
        </main>
    </div>
</div>