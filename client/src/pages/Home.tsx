// Home redirects to /auth — actual app is at /
import { Redirect } from "wouter";

export default function Home() {
  return <Redirect to="/" />;
}
