<script lang="ts">
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { CircleAlert } from "@lucide/svelte";
</script>
<div class="mt-5 w-103.5 max-sm:w-full max-sm:p-3 max-w-187.5 text-sm font-light">
    <Alert>
        <CircleAlert class="h-4 w-4" />
        <AlertTitle>Внимание!</AlertTitle>
        <AlertDescription>
            Все операции производятся локально в вашем браузере. Все ваши данные не покидают эту вкладку! При необходимости вы можете собрать собственную копию с GitHub.
        </AlertDescription>
    </Alert>
</div>
<div class="mt-5 max-w-187.5 text-center text-sm font-light text-gray-500">
    <p><a href="https://github.com/li0ard/cpfx_web" class="underline">GitHub</a></p>
    <p>&copy; { new Date().getFullYear() } <a href="https://li0ard.rest" target="_blank" class="underline">li0ard</a></p>
</div>