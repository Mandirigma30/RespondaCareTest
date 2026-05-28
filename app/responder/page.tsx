import { redirect } from "next/navigation";

export default function ResponderRoot() {
  redirect("/responder/dispatch");
}
