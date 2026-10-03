"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const blueprintSchema = z.object({
  visual_design: z.string().min(10, "Please describe the visual design in detail."),
  materials_needed: z.string().min(5, "List materials needed."),
  availability: z.string().min(5, "Are they readily available?"),
  cost_effectiveness: z.string().min(5, "Are they cost-effective?"),
  construction_feasibility: z.string().min(10, "How feasible is construction?"),
  competitors: z.string().min(10, "Who are the competitors?"),
  time_constraints: z.string().min(5, "Can it be made in a short time?"),
  societal_accessibility: z.string().min(10, "Is it accessible to all sections of society?"),
  cost_reduction: z.string().min(10, "Can cost be reduced over time?"),
  multi_purpose: z.string().min(5, "Does it serve multiple purposes?"),
})

export default function BlueprintPage() {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof blueprintSchema>>({
    resolver: zodResolver(blueprintSchema),
    defaultValues: {
      visual_design: "", materials_needed: "", availability: "", cost_effectiveness: "",
      construction_feasibility: "", competitors: "", time_constraints: "",
      societal_accessibility: "", cost_reduction: "", multi_purpose: "",
    },
  })

  function onSubmit(values: z.infer<typeof blueprintSchema>) {
    setIsSaving(true)
    setTimeout(() => {
      console.log(values)
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Blueprint & Ideation Studio</h2>
        <p className="text-muted-foreground">Milestone 3: Develop a rough plan for your product based on Design Thinking.</p>
      </div>

      <Tabs defaultValue="blueprint" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="blueprint">10 Blueprint Questions</TabsTrigger>
          <TabsTrigger value="ideation">Ideation Board</TabsTrigger>
        </TabsList>
        <TabsContent value="blueprint" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Structured Analysis</CardTitle>
                  <CardDescription>Critically analyze your project idea before prototyping.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="visual_design" render={({ field }) => (
                            <FormItem><FormLabel>1. What will the product look like?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="materials_needed" render={({ field }) => (
                            <FormItem><FormLabel>2. What materials are needed?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="availability" render={({ field }) => (
                            <FormItem><FormLabel>3. Are materials readily available?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cost_effectiveness" render={({ field }) => (
                            <FormItem><FormLabel>4. Are they cost-effective for prototyping?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="construction_feasibility" render={({ field }) => (
                            <FormItem><FormLabel>5. How feasible is construction?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="competitors" render={({ field }) => (
                            <FormItem><FormLabel>6. Who are competitors & how will you market?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="time_constraints" render={({ field }) => (
                            <FormItem><FormLabel>7. Can it be made within a short time frame?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="societal_accessibility" render={({ field }) => (
                            <FormItem><FormLabel>8. Is it accessible to all sections of society?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cost_reduction" render={({ field }) => (
                            <FormItem><FormLabel>9. Can cost be reduced over time?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="multi_purpose" render={({ field }) => (
                            <FormItem><FormLabel>10. Will it serve one or multiple purposes?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                  <p className="text-sm text-muted-foreground">Changes are saved automatically when submitted.</p>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Blueprint"}</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="ideation" className="mt-6">
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 className="text-lg font-medium">Upload Brainstorming Photos</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                        Upload rough sketches, mind maps, concept blueprints, and photos of group discussions here.
                    </p>
                    <Button variant="outline">Select Files</Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
