import { articleDb } from "../../../lib/article-store";
import { notFound } from "next/navigation";
export const dynamic="force-dynamic";
export default async function Article({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 const a=await articleDb().prepare("SELECT title,body,image,category,published_at,media_json FROM articles WHERE id=? AND status='published'").bind(id).first<{title:string;body:string;image:string;category:string;published_at:string;media_json:string|null}>();
 if(!a)notFound();
 return <main className="public-article"><img className="public-logo" src="/assets/vinconnect-transparent.png" alt="VINCONNECT"/><p>{a.category}</p><h1>{a.title}</h1><img className="article-photo" src={a.image} alt={a.title}/>{a.media_json&&JSON.parse(a.media_json).slice(1).map((p:any)=><img className="article-photo" key={p.rendered} src={p.rendered} alt={a.title}/>)}<div className="article-body">{a.body}</div><a href="https://vinconnect.com.au">Visit VINCONNECT</a></main>
}
